# Task: gen-rec-sum_digits-1937 | Score: 100% | 2026-02-15T08:49:19.771681

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)