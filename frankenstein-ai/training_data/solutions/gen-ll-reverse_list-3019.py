# Task: gen-ll-reverse_list-3019 | Score: 100% | 2026-02-15T11:13:10.419898

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))