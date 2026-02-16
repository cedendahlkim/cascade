# Task: gen-rec-sum_digits-8675 | Score: 100% | 2026-02-13T14:56:50.928149

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)