# Task: gen-rec-sum_digits-3854 | Score: 100% | 2026-02-13T11:53:59.679315

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)