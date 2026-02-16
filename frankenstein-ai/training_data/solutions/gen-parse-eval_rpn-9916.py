# Task: gen-parse-eval_rpn-9916 | Score: 100% | 2026-02-13T19:35:13.214832

def evaluate_rpn():
    n = int(input())
    stack = []
    for _ in range(n):
        token = input()
        if token.isdigit() or (token.startswith('-') and token[1:].isdigit()):
            stack.append(int(token))
        else:
            operand2 = stack.pop()
            operand1 = stack.pop()
            if token == '+':
                stack.append(operand1 + operand2)
            elif token == '-':
                stack.append(operand1 - operand2)
            elif token == '*':
                stack.append(operand1 * operand2)
            elif token == '/':
                if operand2 == 0:
                    print("Error: Division by zero")
                    return
                stack.append(int(operand1 / operand2))
    print(stack[0])

evaluate_rpn()