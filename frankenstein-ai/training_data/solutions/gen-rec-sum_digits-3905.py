# Task: gen-rec-sum_digits-3905 | Score: 100% | 2026-02-15T11:36:45.264048

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)