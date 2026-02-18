# Task: gen-ds-balanced_brackets-3869 | Score: 100% | 2026-02-17T20:00:24.708756

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