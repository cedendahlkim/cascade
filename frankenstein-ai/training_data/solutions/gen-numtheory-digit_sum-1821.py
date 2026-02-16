# Task: gen-numtheory-digit_sum-1821 | Score: 100% | 2026-02-12T12:44:52.505106

n = input()
s = 0
for digit in n:
    s += int(digit)
print(s)