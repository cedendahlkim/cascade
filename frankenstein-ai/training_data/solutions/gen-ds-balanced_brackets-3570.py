# Task: gen-ds-balanced_brackets-3570 | Score: 100% | 2026-02-10T15:43:57.470535

def is_balanced(s):
    stack = []
    mapping = {')': '(', ']': '[', '}': '{'}
    for char in s:
        if char in mapping.values():
            stack.append(char)
        elif char in mapping:
            if not stack or stack[-1] != mapping[char]:
                return 'no'
            stack.pop()
    return 'yes' if not stack else 'no'

s = input()
print(is_balanced(s))