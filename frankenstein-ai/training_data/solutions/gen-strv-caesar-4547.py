# Task: gen-strv-caesar-4547 | Score: 100% | 2026-02-13T09:51:17.437563

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