# Task: gen-rec-sum_digits-1341 | Score: 100% | 2026-02-15T08:14:40.522007

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)