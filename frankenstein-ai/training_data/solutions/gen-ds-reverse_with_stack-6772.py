# Task: gen-ds-reverse_with_stack-6772 | Score: 100% | 2026-02-14T12:28:32.199861

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))