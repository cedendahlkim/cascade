# Task: gen-numtheory-digit_sum-6813 | Score: 100% | 2026-02-12T12:41:44.910533

n = input()
s = 0
for digit in n:
    s += int(digit)
print(s)