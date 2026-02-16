# Task: gen-ds-balanced_brackets-6632 | Score: 100% | 2026-02-13T14:00:27.662012

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