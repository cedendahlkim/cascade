# Task: gen-ll-reverse_list-9247 | Score: 100% | 2026-02-14T12:28:41.560534

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))