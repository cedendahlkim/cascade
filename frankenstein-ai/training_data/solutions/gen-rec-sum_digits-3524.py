# Task: gen-rec-sum_digits-3524 | Score: 100% | 2026-02-14T12:59:43.042044

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)