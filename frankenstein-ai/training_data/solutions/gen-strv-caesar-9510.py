# Task: gen-strv-caesar-9510 | Score: 100% | 2026-02-14T12:48:40.807280

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