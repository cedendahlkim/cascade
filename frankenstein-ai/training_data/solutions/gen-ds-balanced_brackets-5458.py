# Task: gen-ds-balanced_brackets-5458 | Score: 100% | 2026-02-15T09:51:22.594161

s = input()
stack = []
pairs = {')': '(', ']': '[', '}': '{'}
ok = True
for c in s:
    if c in '([{':
        stack.append(c)
    elif c in ')]}':
        if not stack or stack[-1] != pairs[c]:
            ok = False
            break
        stack.pop()
if stack:
    ok = False
print('yes' if ok else 'no')