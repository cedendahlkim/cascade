# Task: gen-rec-sum_digits-6332 | Score: 100% | 2026-02-14T12:20:43.003707

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)