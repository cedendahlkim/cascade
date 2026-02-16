# Task: gen-ll-reverse_list-3410 | Score: 100% | 2026-02-15T08:14:04.605909

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))