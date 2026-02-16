# Task: gen-ds-balanced_brackets-6282 | Score: 100% | 2026-02-10T15:43:43.854597

def is_balanced(s):
    stack = []
    mapping = {')': '(', ']': '[', '}': '{'}
    for char in s:
        if char in '([{':
            stack.append(char)
        elif char in ')]}':
            if not stack:
                return 'no'
            top_element = stack.pop()
            if mapping[char] != top_element:
                return 'no'
    if not stack:
        return 'yes'
    else:
        return 'no'

s = input()
print(is_balanced(s))