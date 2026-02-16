# Task: 5.5 | Score: 100% | 2026-02-10T15:39:22.886995

def rpn_calculator(expression):
    stack = []
    tokens = expression.split()

    for token in tokens:
        if token.isdigit() or (token.startswith('-') and token[1:].isdigit()):
            stack.append(int(token))
        else:
            if len(stack) < 2:
                return "Error: Insufficient operands"

            operand2 = stack.pop()
            operand1 = stack.pop()

            if token == '+':
                result = operand1 + operand2
            elif token == '-':
                result = operand1 - operand2
            elif token == '*':
                result = operand1 * operand2
            elif token == '/':
                if operand2 == 0:
                    return "Error: Division by zero"
                result = int(operand1 / operand2)
            else:
                return "Error: Invalid operator"

            stack.append(result)

    if len(stack) != 1:
        return "Error: Invalid expression"

    return stack[0]

expression = input()
result = rpn_calculator(expression)
print(result)