# Task: gen-ds-reverse_with_stack-1103 | Score: 100% | 2026-02-13T18:30:00.103889

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))