# Task: gen-rec-sum_digits-9567 | Score: 100% | 2026-02-14T12:02:41.552415

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)