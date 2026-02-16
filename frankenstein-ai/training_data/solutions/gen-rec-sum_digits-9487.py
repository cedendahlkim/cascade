# Task: gen-rec-sum_digits-9487 | Score: 100% | 2026-02-15T10:29:13.130335

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)