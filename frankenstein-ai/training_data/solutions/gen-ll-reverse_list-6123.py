# Task: gen-ll-reverse_list-6123 | Score: 100% | 2026-02-14T12:37:23.414688

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))