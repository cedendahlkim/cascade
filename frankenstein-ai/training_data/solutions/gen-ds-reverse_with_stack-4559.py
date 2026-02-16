# Task: gen-ds-reverse_with_stack-4559 | Score: 100% | 2026-02-13T11:18:13.375872

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))