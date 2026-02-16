# Task: gen-rec-sum_digits-6593 | Score: 100% | 2026-02-15T07:45:49.994389

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)