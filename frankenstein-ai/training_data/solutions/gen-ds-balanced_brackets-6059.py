# Task: gen-ds-balanced_brackets-6059 | Score: 100% | 2026-02-12T13:43:54.951630

def is_balanced(s):
    stack = []
    mapping = {')': '(', ']': '[', '}': '{'}
    for char in s:
        if char in '([{':
            stack.append(char)
        elif char in ')]}':
            if not stack:
                return 'no'
            top = stack.pop()
            if mapping[char] != top:
                return 'no'
    if not stack:
        return 'yes'
    else:
        return 'no'

s = input()
print(is_balanced(s))