# Task: gen-rec-sum_digits-7982 | Score: 100% | 2026-02-15T07:59:41.308948

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)