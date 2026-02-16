# Task: gen-ll-reverse_list-7320 | Score: 100% | 2026-02-15T12:03:22.284572

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))