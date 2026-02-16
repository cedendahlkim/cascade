# Task: gen-list-range-9771 | Score: 100% | 2026-02-13T18:36:06.397203

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))