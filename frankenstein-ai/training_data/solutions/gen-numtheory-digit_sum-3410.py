# Task: gen-numtheory-digit_sum-3410 | Score: 100% | 2026-02-12T20:53:10.353683

n = input()
s = 0
for digit in n:
    s += int(digit)
print(s)