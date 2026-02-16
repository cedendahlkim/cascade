# Task: gen-rec-sum_digits-5647 | Score: 100% | 2026-02-15T08:05:35.313108

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)