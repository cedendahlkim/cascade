# Task: gen-fsm-parens-6524 | Score: 100% | 2026-02-17T19:58:17.959226

def solve():
    s = input()
    stack = []
    for char in s:
        if char == '(':
            stack.append(char)
        elif char == ')':
            if not stack:
                print("no")
                return
            stack.pop()
    if not stack:
        print("yes")
    else:
        print("no")

solve()