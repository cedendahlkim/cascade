# Task: gen-ds-reverse_with_stack-9105 | Score: 100% | 2026-02-13T18:29:46.702923

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))