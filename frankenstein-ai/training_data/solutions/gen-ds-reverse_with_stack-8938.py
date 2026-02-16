# Task: gen-ds-reverse_with_stack-8938 | Score: 100% | 2026-02-13T18:00:46.827650

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))