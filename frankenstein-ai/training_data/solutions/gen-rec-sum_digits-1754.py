# Task: gen-rec-sum_digits-1754 | Score: 100% | 2026-02-14T13:11:52.657651

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)