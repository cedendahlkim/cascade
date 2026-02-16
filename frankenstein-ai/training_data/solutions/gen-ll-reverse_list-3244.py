# Task: gen-ll-reverse_list-3244 | Score: 100% | 2026-02-15T08:06:28.076528

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))