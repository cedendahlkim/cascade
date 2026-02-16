# Task: gen-rec-sum_digits-8269 | Score: 100% | 2026-02-15T08:15:25.645772

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)