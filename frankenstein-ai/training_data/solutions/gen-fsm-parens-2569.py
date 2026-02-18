# Task: gen-fsm-parens-2569 | Score: 100% | 2026-02-17T19:57:59.845124

def solve():
    s = input()
    stack = []
    for char in s:
        if char == '(':
            stack.append(char)
        elif char == ')':
            if not stack:
                print('no')
                return
            stack.pop()
    if not stack:
        print('yes')
    else:
        print('no')

solve()