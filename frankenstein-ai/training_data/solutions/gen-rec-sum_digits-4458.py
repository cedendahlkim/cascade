# Task: gen-rec-sum_digits-4458 | Score: 100% | 2026-02-15T08:14:21.299666

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)