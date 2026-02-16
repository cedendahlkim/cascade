# Task: gen-ll-reverse_list-4835 | Score: 100% | 2026-02-15T11:37:33.208507

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))