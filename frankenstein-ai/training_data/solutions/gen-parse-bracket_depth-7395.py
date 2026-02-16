# Task: gen-parse-bracket_depth-7395 | Score: 100% | 2026-02-14T13:41:54.757749

def solve():
    s = input()
    stack = []
    max_depth = 0
    current_depth = 0
    
    mapping = {')': '(', ']': '[', '}': '{'}
    
    for char in s:
        if char in ['(', '[', '{']:
            stack.append(char)
            current_depth += 1
            max_depth = max(max_depth, current_depth)
        elif char in [')', ']', '}']:
            if not stack:
                print("-1")
                return
            
            top = stack.pop()
            if mapping[char] != top:
                print("-1")
                return
            current_depth -= 1
            
    if stack:
        print("-1")
    else:
        print(max_depth)

solve()