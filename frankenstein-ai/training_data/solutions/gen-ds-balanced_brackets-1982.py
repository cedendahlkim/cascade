# Task: gen-ds-balanced_brackets-1982 | Score: 100% | 2026-02-12T13:00:10.989282

def is_balanced(s):
    stack = []
    mapping = {')': '(', ']': '[', '}': '{'}
    for char in s:
        if char in '([{':
            stack.append(char)
        elif char in ')]}':
            if not stack or stack[-1] != mapping[char]:
                return 'no'
            stack.pop()
    return 'yes' if not stack else 'no'

s = input()
print(is_balanced(s))