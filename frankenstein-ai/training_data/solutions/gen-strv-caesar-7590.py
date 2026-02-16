# Task: gen-strv-caesar-7590 | Score: 100% | 2026-02-13T14:56:43.421871

s = input()
n = int(input())
result = []
for c in s:
    if c.isalpha():
        base = ord('a') if c.islower() else ord('A')
        result.append(chr((ord(c) - base + n) % 26 + base))
    else:
        result.append(c)
print(''.join(result))