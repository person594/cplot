var numericConstant = "[0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?";
var variableName = "z|e|i|pi";
var functionName = "ln|log|lg|exp|gamma|abs|sqrt|sinh?|cosh?|tanh?|asin|acos|atan|sech?|csch?|coth?";
var identifier = functionName + "|" + variableName;
var symbol = "[\\[\\]()+*/^!-]";
var whitespace = "(\\s|\\t|\\n|\\r|\\v)+";

function tokenize(expression) {
	var token = RegExp("(" + numericConstant + "|" + identifier + "|" + symbol + "|" + whitespace + ")", "g");
	
	var tokenStream = expression.match(token);
	if (!tokenStream) return false;
	if (tokenStream.join("") != expression) return false;
	
	tokenStream = tokenStream.filter(function(token) {
		return ! token.match("^" + whitespace + "$");
	});
	
	tokenStream.push("\n");
	
	return tokenStream;

}


/*
	atomicExpression:
	{variableName}
	| ( {expression} )
	| [ {expression} ]
	| {functionName} ( {expression} )
	| {functionName} [ {expression} ]
	exponentialExpression:
	{atomicExpression}+ ^ {exponentialExpression}
	| {atomicExpression}+
	multiplicativeExpression:
	{exponentialExpression}
	| {multiplicativeExpression} * {exponentialExpression}
	| {multiplicativeExpression} / {exponentialExpression}
*/
 
function parse(inputStream) {
	if (!inputStream) return false;
	var i = 0;
	
	function parseVariableName() {
		var token = inputStream[i];
		if (token.match("^" + variableName + "$")) {
			++i;
			return token;
		} else return false;
	}
	
	function parseFunctionName() {
		var token = inputStream[i];
		if (token.match("^" + functionName + "$")) {
			++i;
			return token;
		} else return false;
	}
	
	function parseNumericConstant() {
		var token = inputStream[i];
		if (token.match("^" + numericConstant + "$")) {
			++i;
			return token;
		} else return false;
	}

	function parseAtomicExpression() {
		var i0 = i;
		var fn = parseFunctionName();
		var closer;
		if (inputStream[i] == '(') closer = ')';
		else if (inputStream[i] == '[') closer = ']';
		else {
			i = i0;
			return parseVariableName() || parseNumericConstant();
		}
		++i;
		var inner = parseExpression();
		if (inputStream[i++] != closer) {
			 i = i0;
			 return false;
		}
		return fn ? [fn, inner] : inner;
	}
	//takes care of implied multiplication and unitary negation as well
	function parseExponentialExpression() {
		var i0 = i;
		var sign;
		if (inputStream[i] == '-' || inputStream[i] == '+') {
			var sign = inputStream[i++];
		}
		var multiplicands = [parseAtomicExpression()];
		if (!multiplicands[0]) return false;
		var ae;
		while (ae = parseAtomicExpression()) {
			multiplicands.push(ae)
		}
		var power;
		if (inputStream[i] == '^' || inputStream[i] == '**') {
			++i;
			power = parseExponentialExpression();
			if (!power) {
				i = i0;
				return false;
			}
			var base = multiplicands.pop();
			multiplicands.push(["^", base, power]);
		}
		var expression = multiplicands[0]
		multiplicands.slice(1).forEach(function(multiplicand) {
			expression = ["*", expression, multiplicand];
		});
		if (sign == '-') {
			expression = ["-", expression];
		}
		return expression;
	}
	/*
	//unitary + and -
	function parseUnitaryExpression() {
		var i0 = i;
		var negate = false
		if (inputStream[i] == "+" || inputStream[i] == "-") {
			negate = (inputStream[++i] == '-');
		}
		var e = parseExponentialExpression();
		if (!e) {
			i =  i0;
			return false;
		}
		if (negate) {
			return ["-", e];
		} else return e;
	}
	*/
	
	function parseMultiplicativeExpression() {
		var i0 = i;
		var left = parseExponentialExpression();
		if (!left) return false;
		while (inputStream[i] == '*' || inputStream[i] == '/') {
			var operator = inputStream[i++];
			var right = parseExponentialExpression();
			if (! right) {
				i = i0;
				return false;
			}
			left = [operator, left, right];
		}
		return left;
	}
	
	function parseAdditiveExpression() {
		var i0 = i;
		var left = parseMultiplicativeExpression();
		if (!left) return false;
		while (inputStream[i] == '+' || inputStream[i] == '-') {
			var operator = inputStream[i++];
			var right = parseMultiplicativeExpression();
			if (! right) {
				i = i0;
				return false;
			}
			left = [operator, left, right];
		}
		return left;
	}
	
	
	function parseExpression() {
		return parseAdditiveExpression();
	}
	
	
	var expression = parseExpression();
	if (inputStream[i] != '\n') return false;
	return expression;
}



function toGLSL(expression) {
	
	if (typeof(expression) == "string") {
		if (expression.match("^" + numericConstant + "$")) {
			return "vec2(" + expression + ", 0)";
		} else if (expression.match("^" + variableName + "$")) {
			switch(expression) {
				case "e":
					return "vec2(" + String(Math.E) + ", 0)";
				case "pi":
					return "vec2(" + String(Math.PI) + ", 0)";
				case "i":
					return "vec2(0, 1)";
				case "z":
					return "v_z";
			}
		}
		return "{oops: " + expression + "}";
	}
	if (expression[0].match("^" + functionName + "$")) {
		return "c_" + expression[0] + "(" + toGLSL(expression[1]) + ")";
	}
	switch(expression[0]) {
		case "+":
			return "(" + toGLSL(expression[1]) + " + " + toGLSL(expression[2]) + ")";
		case "-":
			if (expression.length == 2)
				return "( -" + toGLSL(expression[1]) + ")";
			return "(" + toGLSL(expression[1]) + " - " + toGLSL(expression[2]) + ")"
		case "*":
			return "_mult(" + toGLSL(expression[1]) + ", " + toGLSL(expression[2]) + ")";
		case "/":
			return "_mult(" + toGLSL(expression[1]) + ", c_inv(" + toGLSL(expression[2]) + "))";
		case "^":
			return "_pow(" + toGLSL(expression[1]) + "," + toGLSL(expression[2]) + ")";
	}
	
}


console.log(toGLSL(
	parse(
		tokenize(
			"3ze^4 * pi^52z"
		)
	)
));
