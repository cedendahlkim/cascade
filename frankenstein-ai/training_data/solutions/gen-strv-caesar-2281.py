# Task: gen-strv-caesar-2281 | Score: 100% | 2026-02-14T12:20:17.470935

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