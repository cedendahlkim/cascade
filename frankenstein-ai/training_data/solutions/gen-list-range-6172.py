# Task: gen-list-range-6172 | Score: 100% | 2026-02-13T18:30:03.521170

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))