# Task: gen-ds-reverse_with_stack-5865 | Score: 100% | 2026-02-13T13:39:13.730278

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))