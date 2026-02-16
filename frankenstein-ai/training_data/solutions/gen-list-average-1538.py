# Task: gen-list-average-1538 | Score: 100% | 2026-02-13T18:24:16.280786

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))