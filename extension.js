// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require("path");

// script settings
// ErrM means ErrorMessage
var CreatingMDFile_ErrM = 'Error creating MD file.';
var fileExtension = '.md';
var JSONNotValidMessage = "JSON is not in a valid format";
var CreatedFile_InfoMessage = "Press Ctrl+S to save your file. Then you can right click on tab with file name and right click > `Open Preview` to preview the .md file.";
var ConvertedFileReady_InfoMessage = "Converted File is ready for you.";
var sp1 = " ";
var emp = "";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('json-snippet-to-md-documentation.toMdDoc', function () {
		// The code you place here will be executed every time your command is executed
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			let document = editor.document;

			// Get the document text
			const documentText = document.getText();

			var mdText = convertToDocumentation(documentText);

			openMDFile(mdText);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}

// ---------------- User Function ---------------- //

/**
 * @param {string} documentText
 */

function convertToDocumentation(documentText){
	var md = emp;
	var current = emp;
	var br = "\n";
	var numberOfElements = 50;
	var multiplePrefix = emp;
	var isMultiplePrefix = 0;
	var multipleBody = emp;
	var isMultipleBody = 0;
	var currentPath = vscode.window.activeTextEditor.document.uri.toString();

	var blockCodeLanguage = currentPath.substring( 0, currentPath.indexOf(".") );
	blockCodeLanguage = blockCodeLanguage.substring( blockCodeLanguage.lastIndexOf('/') + 1 , blockCodeLanguage.length);

	documentText = removeComments(documentText);
	documentText = removeTrailingCommas(documentText);

	if(isJson(documentText)){
		var jsonData = JSON.parse(documentText);
		
		var conf = vscode.workspace.getConfiguration();
		var confMultiplePrefixesDelimiter = conf.get("json-snippet-to-md-documentation.multiplePrefixesDelimiter");
		var confCodeBlockMessageStart = conf.get("json-snippet-to-md-documentation.codeBlockMessageStart");
		var confCodeBlockMessageEnd = conf.get("json-snippet-to-md-documentation.CodeBlockMessageEnd");
		var confMDHeader = conf.get("json-snippet-to-md-documentation.MDHeader");
		var confMDdescription = conf.get("json-snippet-to-md-documentation.MDdescription");

		md = md + "# " + confMDHeader + br;
		md = md + confMDdescription + br;

		for (var key in jsonData) {
			current = "";

			if (jsonData.hasOwnProperty(key)) {

				multiplePrefix = "";
				isMultiplePrefix = 0;
				multipleBody = "";
				isMultipleBody = 0;

				// concatenate string when prefix is an array
				if(Array.isArray(jsonData[key]["prefix"])){
					isMultiplePrefix = 1;

					var prefixArr = [];
					prefixArr = jsonData[key]["prefix"];

					for(var x=0; x<prefixArr.length; x++){
						multiplePrefix = multiplePrefix + prefixArr[x] + sp1 + confMultiplePrefixesDelimiter + sp1;
					}

					multiplePrefix = multiplePrefix.substring(0, multiplePrefix.length - 4);
				}

				// concatenate string when body is an array
				if(Array.isArray(jsonData[key]["body"])){
					isMultipleBody = 1;
					
					var bArr = []; 
					bArr = jsonData[key]["body"];
			
					for(var d=0; d < bArr.length; d++){
						multipleBody = multipleBody + bArr[d] + br;
					}
				}
				
				current = current + "> " + "## " + jsonData[key]["description"] + br; // Header
				current = current + ">  **Prefix:** " + (isMultiplePrefix == 0 ? jsonData[key]["prefix"] : multiplePrefix) + br; // Prefix Description
				current = current + "```" + blockCodeLanguage + "" + br + 
						" /*" + confCodeBlockMessageStart + sp1 + (isMultiplePrefix == 0 ? jsonData[key]["prefix"] : multiplePrefix) + sp1 + confCodeBlockMessageEnd + "*/ " + br + 
						sp1 + (isMultipleBody == 0 ? jsonData[key]["body"] : multipleBody) + sp1 + br + "```  "; // Code Block

				// Remove special characters from snippet placeholders
				current = current.replace(/\$/g, emp);
				current = current.replace(/\{/g, emp);
				current = current.replace(/\}/g, emp);

				// Remove all numbers from placeholders
				for(var i=0; i<numberOfElements; i++){
					var regEx = new RegExp(i + ':', 'g');
				
					current = current.replace(regEx, emp);
				}

				md = md + current + br;
			}
		}
	}
	else{
		return JSONNotValidMessage;
	}

	return md;
}

function isJson(item) {
    item = typeof item !== "string"
        ? JSON.stringify(item)
        : item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    if (typeof item === "object" && item !== null) {
        return true;
    }

    return false;
}

function openMDFile(mdText){
	var p = vscode.window.activeTextEditor.document.uri.fsPath.toString();
		p = p.substring( 0, p.indexOf(".") );
	
	var tstmp = Math.floor(Date.now() / 1000);

	const newFile = vscode.Uri.parse('untitled:' + path.join(p + tstmp + fileExtension));

	vscode.workspace.openTextDocument(newFile).then(document => {
		const edit = new vscode.WorkspaceEdit();		
		
		edit.insert(newFile, new vscode.Position(0, 0), mdText);
		
		return vscode.workspace.applyEdit(edit).then(success => {
			if (success) {
				vscode.window.showTextDocument(document);
				vscode.window.showInformationMessage(ConvertedFileReady_InfoMessage);
				vscode.window.showInformationMessage(CreatedFile_InfoMessage);
			} else {
				vscode.window.showInformationMessage(CreatingMDFile_ErrM);
			}
		});
	});
}

function removeComments(string){
    return string.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,'').trim();
}

function removeTrailingCommas(string){
	return string.replace(/\,(?!\s*?[\{\[\"\'\w])/g, '');
}